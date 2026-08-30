# TMFX_SIGNAL

TMFX_SIGNAL is the surface signal engine for the TMFX trading concept.

## Surface inputs

- USER ID = currency pair
- PASSWORD = timeframe

The selected currency becomes the internal `L2` state. The user does not access the Magic Room, H/L, Fibonacci construction, or Trading Map.

## 12-zone Roof/Floor map

The surface represents the twelve Roof/Floor panels visible in the configured chart layout: 90/65, 85/60, 80/55, 75/50, 70/45, 65/40, 60/35, 55/30, 50/25, 45/20, 40/15 and 35/10. RSI 31 is not treated as a separate trading signal; it was used on the phone as the second RSI boundary so a Roof/Floor zone could be displayed around RSI 30.

The core confirmations are:

- RSI 30 PEAKED + RSI 30 below RSI 800 = SELLING TREND CONFIRMED
- RSI 30 TROUGHED + RSI 30 above RSI 800 = BUYING TREND CONFIRMED
- Roof = high-side opportunity / peak context
- Floor = low-side opportunity / trough context
- O12 = propelling OSMA
- O36 = magnified OSMA used to read higher-timeframe propulsion on a lower timeframe
- Double Edge = O12 and O36 begin/strengthen together

Configured Fibonacci/Magic values are treated as the existing price map. This surface does not rebuild the Fibonacci construction.

## Optional Twelve Data adapter

The app works with the configured H/L fallback when the external provider is unavailable.

If you want live RSI/O12/O36 data, create this Vercel environment variable:

`TWELVE_DATA_KEY`

Do not put the key in `index.html` or GitHub.

The server adapter requests:

- RSI 30
- RSI 800
- MACD 12/26/9 as O12
- MACD 36/78/27 as O36

Twelve Data supports custom RSI periods and customizable MACD periods. See the official Twelve Data documentation for current limits and plan requirements.


## TMFX logic order
The signal layer reads the originating/propelling O12 before treating a lower-timeframe Fibonacci/magic line as a likely stopping point. A fresh/strong higher-timeframe propeller may break multiple lower-timeframe lines. Roof/Floor is primarily an exhaustion map; it is not an automatic entry. Confirmed direction requires RSI 30 PEAKED below RSI 800 for sell, or RSI 30 TROUGHED above RSI 800 for buy. Double Edge indicates dual propulsion and the higher timeframe generating it must be identified.
