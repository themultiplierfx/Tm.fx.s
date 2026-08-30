export default async function handler(req,res){
  const pair=String(req.query?.pair||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  const timeframe=String(req.query?.timeframe||'15MIN').toUpperCase();
  const key=process.env.TWELVE_DATA_KEY;
  const symbols={XAUUSD:'XAU/USD',XAGUSD:'XAG/USD',BTCUSD:'BTC/USD',ETHUSD:'ETH/USD',SOLUSD:'SOL/USD',EURUSD:'EUR/USD',GBPUSD:'GBP/USD',AUDUSD:'AUD/USD',NZDUSD:'NZD/USD',USDJPY:'USD/JPY',USDCAD:'USD/CAD',USDCHF:'USD/CHF',EURJPY:'EUR/JPY',GBPJPY:'GBP/JPY',EURGBP:'EUR/GBP',EURAUD:'EUR/AUD',GBPAUD:'GBP/AUD',EURCAD:'EUR/CAD',GBPCAD:'GBP/CAD',AUDCAD:'AUD/CAD',AUDJPY:'AUD/JPY',NZDJPY:'NZD/JPY',CADJPY:'CAD/JPY',CHFJPY:'CHF/JPY',EURCHF:'EUR/CHF',GBPCHF:'GBP/CHF',EURNZD:'EUR/NZD',GBPNZD:'GBP/NZD',AUDNZD:'AUD/NZD',NZDCAD:'NZD/CAD',EURSGD:'EUR/SGD',USDCNH:'USD/CNH',NZDCHF:'NZD/CHF',USDZAR:'USD/ZAR',USDSGD:'USD/SGD'};
  const intervals={ '1MIN':'1min','5MIN':'5min','15MIN':'15min','30MIN':'30min','1HR':'1h' };
  const prop={ '1MIN':'5min','5MIN':'15min','15MIN':'1h','30MIN':'4h','1HR':'1day' };
  if(!symbols[pair]) return res.status(400).json({status:'error',message:'Unsupported pair'});
  if(!key) return res.status(503).json({status:'error',message:'TWELVE_DATA_KEY is not configured'});
  const interval=intervals[timeframe];
  if(!interval) return res.status(400).json({status:'error',message:'Unsupported timeframe'});
  const symbol=encodeURIComponent(symbols[pair]);
  async function td(path,params){
    const u=new URL('https://api.twelvedata.com/'+path);
    Object.entries({...params,symbol:symbols[pair],apikey:key}).forEach(([k,v])=>u.searchParams.set(k,v));
    const r=await fetch(u); const j=await r.json(); if(!r.ok||j.status==='error') throw new Error(j.message||'Twelve Data error'); return j;
  }
  try{
    const [quote,r30,r800,m12,m36]=await Promise.all([
      td('quote',{interval}),
      td('rsi',{interval,time_period:30,outputsize:6}),
      td('rsi',{interval,time_period:800,outputsize:6}),
      td('macd',{interval,fast_period:12,slow_period:26,signal_period:9,outputsize:36}),
      td('macd',{interval,fast_period:36,slow_period:78,signal_period:27,outputsize:36})
    ]);
    const nums=(arr,key)=>Array.isArray(arr)?arr.map(x=>Number(x[key])).filter(Number.isFinite):[];
    const r1v=nums(r30.values,'rsi'),r2v=nums(r800.values,'rsi');
    const o12v=nums(m12.values,'macd_hist'),o36v=nums(m36.values,'macd_hist');
    const rsi30=r1v.at(-1),rsi800=r2v.at(-1);
    const rsState=()=>{if(r1v.length<3)return 'UNAVAILABLE';const [a,b,c]=r1v.slice(-3);if(c<b&&b>=a)return 'PEAKED';if(c>b&&b<=a)return 'TROUGHED';return c>b?'RISING':c<b?'FALLING':'FLAT'};
    const active=(v)=>v.length>=3 && Math.sign(v.at(-1))!==Math.sign(v.at(-2)) ? 'STARTING' : Math.abs(v.at(-1))>=Math.abs(v.at(-2))?'ACTIVE':'COOLING';
    const doubleEdge=o12v.length>=2&&o36v.length>=2&&Math.sign(o12v.at(-1))===Math.sign(o36v.at(-1))&&Math.abs(o12v.at(-1))>Math.abs(o12v.at(-2))&&Math.abs(o36v.at(-1))>Math.abs(o36v.at(-2));
    return res.status(200).json({status:'ok',live:true,pair,timeframe,high:Number(quote.high),low:Number(quote.low),price:Number(quote.close||quote.price),rsi30,rsi800,rsi30State:rsState(),o12State:active(o12v),o36State:active(o36v),doubleEdge,o12Values:o12v,o36Values:o36v,propellerTimeframe:prop[timeframe]||null});
  }catch(e){return res.status(502).json({status:'error',message:e.message||'External data unavailable'});}
}
