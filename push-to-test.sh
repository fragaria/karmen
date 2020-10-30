npm run build
cp test-env.js build/env.js
scp -r -o ProxyCommand="ssh karmen-gateway nc karmen-test1 22" ./build/* fragaria@karmen-test1:/home/fragaria/frontend/
