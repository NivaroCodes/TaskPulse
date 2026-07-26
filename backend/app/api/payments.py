import stripe
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.auth import get_current_user, AuthUser
from app.core.config import settings
from app.models.subscription import OrganizationSubscription

stripe.api_key = settings.STRIPE_SECRET_KEY

router = APIRouter(prefix="/api/payments", tags=["payments"])

STRIPE_PRICES = {
    "pro": "price_1Tx0jH1UV1vjoMenb0FoHZZP",
    "team": "price_1Tx0jI1UV1vjoMenGPLh6xzE",
    "enterprise": "price_1Tx0jJ1UV1vjoMenzo2iNFPF",
}

@router.post("/stripe/create-checkout")
async def create_stripe_checkout(
    org_id: str,
    plan: str,
    user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if plan not in STRIPE_PRICES:
        raise HTTPException(status_code=400, detail="Invalid plan selected")
        
    price_id = STRIPE_PRICES[plan]
    
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    'price': price_id,
                    'quantity': 1,
                },
            ],
            mode='subscription',
            success_url=f"{settings.FRONTEND_URL}/dashboard?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/pricing",
            client_reference_id=org_id,
            metadata={
                "org_id": org_id,
                "plan": plan
            }
        )
        return {"url": checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stripe/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        org_id = session.get("client_reference_id")
        plan = session.get("metadata", {}).get("plan")
        customer_id = session.get("customer")
        subscription_id = session.get("subscription")
        
        if org_id and plan:
            result = await db.execute(select(OrganizationSubscription).filter_by(org_id=org_id))
            sub = result.scalars().first()
            if not sub:
                sub = OrganizationSubscription(
                    org_id=org_id,
                    plan=plan,
                    stripe_customer_id=customer_id,
                    stripe_subscription_id=subscription_id
                )
                db.add(sub)
            else:
                sub.plan = plan
                sub.stripe_customer_id = customer_id
                sub.stripe_subscription_id = subscription_id
            await db.commit()

    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        sub_id = subscription.get("id")
        
        result = await db.execute(select(OrganizationSubscription).filter_by(stripe_subscription_id=sub_id))
        sub = result.scalars().first()
        if sub:
            sub.plan = "free"
            sub.stripe_subscription_id = None
            await db.commit()

    return {"status": "success"}

@router.post("/kaspi/create-invoice")
async def create_kaspi_invoice(
    org_id: str,
    plan: str,
    user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mock Kaspi Pay invoice generation.
    In production, this would call Kaspi Pay API to generate a QR code/payment link.
    """
    import uuid
    mock_order_id = f"KASPI-{uuid.uuid4().hex[:8]}"
    payment_url = f"{settings.FRONTEND_URL}/kaspi-mock-pay?order_id={mock_order_id}&org_id={org_id}&plan={plan}"
    return {"url": payment_url}

@router.post("/kaspi/webhook")
async def kaspi_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Mock Kaspi webhook endpoint.
    In production, this would verify Kaspi signature and update the DB.
    """
    payload = await request.json()
    org_id = payload.get("org_id")
    plan = payload.get("plan")
    order_id = payload.get("order_id")
    status = payload.get("status")
    
    if status == "PAID" and org_id and plan:
        result = await db.execute(select(OrganizationSubscription).filter_by(org_id=org_id))
        sub = result.scalars().first()
        if not sub:
            sub = OrganizationSubscription(
                org_id=org_id,
                plan=plan,
                kaspi_order_id=order_id
            )
            db.add(sub)
        else:
            sub.plan = plan
            sub.kaspi_order_id = order_id
        await db.commit()
        
    return {"status": "success"}
