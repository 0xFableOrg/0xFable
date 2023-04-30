import React from "react"

if (process.env.NODE_ENV === "development") {
  const whyDidYouRender = require("@welldone-software/why-did-you-render")
  whyDidYouRender(React, {
    trackAllPureComponents: true,
    titleColor: "gray",
    diffNameColor: "gray",
    diffPathColor: "gray"
  })
}