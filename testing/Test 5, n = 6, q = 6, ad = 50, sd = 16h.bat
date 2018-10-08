ECHO Start of Loop

FOR /L %%i IN (1,1,99) DO (
  ECHO %%i
  start chrome "http://localhost:8082/vibe?strategy=BITCOIN_LIKE_BLOCKCHAIN&simulateUntil=1535872740000&blockTime=600&numberOfNeighbours=4&numberOfNodes=20&neighboursDiscoveryInterval=3000&latency=900&transactionSize=1000&maxBlockSize=0&throughput=0&transactionWeight=0&maxBlockWeight=0&networkBandwidth=1&transactionPropagationDelay=150&hashRate=30&confirmations=6&transactionFee=0"
  timeout /t 14
)