# Container Ledger

A browser-only ledger for produce importers. Every container is a cost centre: goods, freight,
clearance, fermentation, labour and overhead post against it, sales post against it, and margin per
carton falls out of the difference.

There is no server and no database. The books are saved in the browser on the device that uses it.

## Use it

- **Hosted:** open the deployed link.
- **One file:** `npm run build` writes `dist/index.html`, a single self-contained file. Email it, host
  it anywhere, or double-click it.
- **Develop:** `npm install`, then `npm run dev`.

## Your data

Data lives in that browser's local storage, per device and per browser. Clearing site data erases it.
**Settings → Download backup** saves everything to a JSON file; **Restore from backup** loads it on any
device. Nothing is ever sent anywhere.

## How margin is worked out

```
cost per carton = total posted cost ÷ cartons received
damage loss     = affected cartons × cost per carton − claims received   (floored at zero)
net profit      = revenue − total cost − damage loss
```

Foreign-currency costs keep their original amount and the rate you entered; the books are in SAR.
