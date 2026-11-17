# Discussion Board

A Next.js App Router port of the supplied discussion board. The canvas, folder dock, toolbar, background, helper, and overlays are React components. Tailwind utilities handle layout and controls; custom CSS preserves the original theme, glass effects, and animations. The board engine owns browser interactions such as drag, pinch, zoom, and media uploads.

```sh
npm install
npm run dev
```

Open http://localhost:3000. To run the production build, use `npm run build` and then `npm start`.

Edit `lib/board-config.js` for branding, floor plans, finish options, and indicative prices. Uploaded assets are stored in IndexedDB on the current browser. Estimate summaries open the device's email app by default.
