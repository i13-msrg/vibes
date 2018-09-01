ECHO Start of Loop

FOR /L %%i IN (1,1,100) DO (
  ECHO %%i
  start chrome "http://localhost:8082/vibe?strategy=BITCOIN_LIKE_BLOCKCHAIN&simulateUntil=1535675460000&blockTime=600&numberOfNeighbours=4&numberOfNodes=20&neighboursDiscoveryInterval=3000&latency=900&transactionSize=1000&maxBlockSize=50000&throughput=1&transactionWeight=2000&maxBlockWeight=200000&networkBandwidth=1&transactionPropagationDelay=150&hashRate=50&confirmations=10&transactionFee=0"
  timeout /t 15
)