// =================================================================================================

/**
 * Simple spinner in "warning" color.
 *
 * Source: https://tailwind-elements.com/docs/standard/components/spinners/
 */
export const Spinner = () => {
  return <>
    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid
        border-current border-r-transparent align-[-0.125em] text-warning
        motion-reduce:animate-[spin_1.5s_linear_infinite]"
      role="status">
      {/* not displayed, for accessibility */}
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap
          !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Loading...
      </span>
    </div>
  </>
}

// =================================================================================================
/* Other cool spinner designs

- https://freefrontend.com/tailwind-spinners/
- https://flowbite.com/docs/components/spinner/

//// Double Spin ////
https://play.tailwindcss.com/OPAsySKNCd

<div>
  <span class="relative inset-0 inline-flex h-6 w-6 animate-spin items-center justify-center
    rounded-full border-2 border-gray-300 after:absolute after:h-8 after:w-8 after:rounded-full
    after:border-2 after:border-y-indigo-500 after:border-x-transparent">
  </span>
</div>

//// Gradient Spin ////
https://tailwindcomponents.com/component/animated-gradient-spinner

<div class="flex justify-center items-center h-screen">
  <div class="relative w-24 h-24 animate-spin rounded-full bg-gradient-to-r from-purple-400 via-blue-500 to-red-400 ">
    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gray-200 rounded-full border-2 border-white"></div>
  </div>
</div>

*/
// =================================================================================================