import stripe
import asyncio
import os

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

def create_prices():
    plans = [
        {"name": "Pro Plan", "amount": 1200, "key": "pro"},
        {"name": "Team Plan", "amount": 2900, "key": "team"},
        {"name": "Enterprise Plan", "amount": 9900, "key": "enterprise"}
    ]
    
    res = {}
    for plan in plans:
        product = stripe.Product.create(name=plan["name"])
        price = stripe.Price.create(
            product=product.id,
            unit_amount=plan["amount"],
            currency="usd",
            recurring={"interval": "month"}
        )
        res[plan["key"]] = price.id
        print(f"Created {plan['name']}: {price.id}")
    
    print("\nSTRIPE_PRICES = {")
    for k, v in res.items():
        print(f'    "{k}": "{v}",')
    print("}")

if __name__ == "__main__":
    create_prices()
