@echo off
echo Testing Better Auth Monitor...
echo.

echo Attempt 1:
curl -X POST http://localhost:3000/api/auth/sign-in -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"wrongpassword\"}"
echo.

echo Attempt 2:
curl -X POST http://localhost:3000/api/auth/sign-in -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"wrongpassword\"}"
echo.

echo Attempt 3:
curl -X POST http://localhost:3000/api/auth/sign-in -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"wrongpassword\"}"
echo.

echo Attempt 4:
curl -X POST http://localhost:3000/api/auth/sign-in -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"wrongpassword\"}"
echo.

echo Attempt 5:
curl -X POST http://localhost:3000/api/auth/sign-in -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"wrongpassword\"}"
echo.

echo.
echo Checking security events:
curl http://localhost:3000/api/auth/monitor/events
echo.

pause
