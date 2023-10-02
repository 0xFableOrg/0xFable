# 0xFable Web App

See the [Makefile](./Makefile) for the available command to build, check code standards, etc...

The frontend is tested as part of the end-to-end tests [in the e2e package](../packages/e2e).

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

For improving the dev/debug experience with Jotai, you can use:

- [Jotai Devtools] — enables debug React hooks that display an UI to track atom values.
- [Jotai SWC Extensions] — enable adding debug labels to atoms (show up in React devtools), and
  preserving atom values when using React refresh (hot reloading).

[Jotai Devtools]: https://jotai.org/docs/tools/devtools
[Jotai SWC Extensions]: https://jotai.org/docs/tools/swc