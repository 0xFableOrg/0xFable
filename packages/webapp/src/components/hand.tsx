import { useRef, useState } from "react"
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai"
import useScrollBox from "../hooks/useScrollBox"
import { Card } from "./card"

const Hand = ({
  cards,
  className,
}: {
  cards?: bigint[] | null
  className?: string
}) => {
  const [isFocused, setIsFocused] = useState<boolean>(false)

  const hand: any = [];
  const scrollWrapperRef = useRef<any>();
  const { isDragging, showLeftArrow, scrollLeft, showRightArrow, scrollRight } =
    useScrollBox(scrollWrapperRef)

  if (cards && cards.length > 0) {
    for (let i = 0; i < cards?.length; i++) {
      hand.push(
        <div key={i}>
          <Card
            id={i}
            className="transitional-all duration-200 hover:scale-[100%] hover:border-yellow-500"
            handHovered={isFocused}
          />
        </div>
      )
    }
  }

  return (
    <div
      className={`${className} flex flex-row items-center justify-evenly absolute bottom-0 z-[100] w-[95%]`}
      onMouseEnter={() => {
        setIsFocused(true);
      }}
      onMouseLeave={() => {
        setIsFocused(false);
      }}
    >
      {showLeftArrow && isFocused && (
        <div
          className="absolute top-[55%] transform -translate-y-1/2 left-0 z-10 p-2 cursor-pointer"
          onClick={scrollLeft}
        >
          <AiOutlineLeft className="text-white text-[50px]" />
        </div>
      )}
      <div className={`relative w-[90%] overflow-x-hidden overflow-y-visible`}>
        <div
          className="overflow-x-scroll no-scrollbar"
          ref={scrollWrapperRef}
          style={{ pointerEvents: isDragging ? "none" : undefined }}
        >
          <div className="relative flex w-max">
            <div className="flex flex-row items-end justify-center space-x-4 px-2">
              {hand}
            </div>
          </div>
        </div>
      </div>
      {showRightArrow && isFocused && (
        <div
          className="absolute top-[55%] transform -translate-y-1/2 right-0 z-10 p-2 cursor-pointer"
          onClick={scrollRight}
        >
          <AiOutlineRight className="text-white text-[50px]" />
        </div>
      )}
    </div>
  );
};

export default Hand;
