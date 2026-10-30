# Welcome to Remix!

- 📖 [Remix docs](https://remix.run/docs)

## Development

Run the dev server:

```shellscript
npm run dev
```

To optimize the MP4s in `public/channels` and `public/previews`, install FFmpeg
on PATH and run `node scripts/optimize-videos.mjs`. This losslessly repackages
the files with front-loaded playback metadata and smaller chunk tables. It
verifies encoded audio/video hashes before replacing each file, and keeps
already optimized files when repackaging would not help.

## Deployment

First, build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying Node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `npm run build`

- `build/server`
- `build/client`

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever css framework you prefer. See the [Vite docs on css](https://vitejs.dev/guide/features.html#css) for more information.
