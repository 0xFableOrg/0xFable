// import useScrollBox from "@/hooks/useScrollBox";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import useScrollBox from "../hooks/useScrollBox";
import { Card } from "./card";

const Hand = ({
  cards,
  className,
}: {
  cards: number[];
  className?: string;
}) => {
  let hand: any = [];
  const scrollWrapperRef = useRef<any>();
  const { isDragging } = useScrollBox(scrollWrapperRef);

  for (let i = 0; i < cards.length; i++) {
    hand.push(
      <div key={i} className="-mx-20">
        {/* <div className="absolute inset-0 z-50 flex cursor-pointer items-center justify-center rounded-md bg-blue-900/20  text-slate-200 opacity-0 transition-all group-hover:opacity-100">
          <p className="bg-slate-900 py-2 pl-0 pr-2">view on opensea</p>
        </div> */}
        <Card
          id={i}
          className="transitional-all duration-200 hover:scale-[100%] hover:border-yellow-500"
        />
      </div>
    );
  }
  return (
    <div
      className={`${className} noScrollbar absolute bottom-0 w-full overflow-scroll`}
      ref={scrollWrapperRef}
    >
      <div
        className="relative flex w-max"
        style={{ pointerEvents: isDragging ? "none" : undefined }}
      >
        {hand}
      </div>
    </div>
  );
};

export default Hand;
