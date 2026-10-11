import os
import redis.asyncio as redis 

 # Use python's async redis client
 # Connect to the shared Redis service (using the service name from docker-compose, e.g., "redis")

redis_client = redis.from_url(
    os.getenv("REDIS_URL", "redis://redis:6379"),
      decode_responses=True
)
