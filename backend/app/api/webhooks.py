@router.post("/clerk")
async def clerk_webhook(request: Request, svix_id: str = Header(None), svix_timestamp: str = Header(None),
                        svix_signature: str = Header(None)):
    if not svix_id or not svix_timestamp or not svix_signature:
        raise HTTPException(status_code=400, detail="Missing Svix headers")

    webhook_secret = settings.CLERK_WEBHOOK_SECRET
    if not webhook_secret:
        raise HTTPException(status_code=500, detail="Clerk webhook secret not set")

    try:
        body = await request.body()

        wh = Webhook(webhook_secret)
        evt = wh.verify(body, {'svix-id': svix_id, 'svix-timestamp': svix_timestamp, 'svix-signature': svix_signature})

        event_type = evt['type']
        data = evt['data']

        if event_type == "user.created":
            print(f"User created: {data['id']} - {data['email_addresses'][0]['email_address']}")
        elif event_type == "organization.created":
            print(f"Organization created: {data['id']} - {data['name']}")

        return {"message": "Webhook received and processed"}

    except WebhookVerificationError as e:
        print(f"Webhook verification failed: {e}")
        raise HTTPException(status_code=400, detail="Webhook verification failed")
    except Exception as e:
        print(f"Error processing webhook: {e}")
        raise HTTPException(status_code=500, detail="Error processing webhook")
