import os
import asyncio
from openai import AsyncOpenAI

async def smoke_test():
    api_key = os.getenv("PERPLEXITY_API_KEY")
    if not api_key:
        print("PERPLEXITY_API_KEY is not set. Using a dummy key to test network and expect 401.")
        api_key = "dummy-key-for-smoke-test"

    client = AsyncOpenAI(
        api_key=api_key,
        base_url="https://api.perplexity.ai/router/v1"
    )
    
    try:
        models = await client.models.list()
        print(f"Models GET status: 200 OK")
        model_id = models.data[0].id
        print(f"Selected model: {model_id}")
        
        response = await client.chat.completions.create(
            model=model_id,
            messages=[{"role": "user", "content": "Hello!"}],
            max_tokens=10
        )
        print(f"Chat Completions POST status: 200 OK")
        print(f"Response shape keys: {response.model_dump().keys()}")
        print(f"Usage: {response.usage.model_dump()}")
    except Exception as e:
        print(f"Error during smoke test: {e}")

if __name__ == "__main__":
    asyncio.run(smoke_test())
