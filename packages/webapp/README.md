# 0xFable Web App

## Dependencies

- `tailwindcss` — for styling, with peer dependencies `autoprefixer` and `postcss`
- `daisyui` — component library for tailwindcss
- `jotai-devtools` with peer dependency @emotion/react (styling for the UI devtool)

## React Debugging

The `why-did-you-render` is installed via `next.config.mjs` and `scripts/whyDidYouRender.js`.
I couldn't get its advertised features (detection of unnecessary re-renders) to work, but it
enables tracking all renders of a component by writing something like this:

```js
// @ts-ignore
MyComponent.whyDidYouRender = {
  logOnDifferentValues: true,
}
```

It can also be [customized][wdyr-custom] to learn about higher-level hooks.

[wdyr-custom]: https://github.com/welldone-software/why-did-you-render