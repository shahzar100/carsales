"use client";
import React from "react";
import { useSkeleton } from "@/hooks/useSkeleton";
import { SkeletonWrapper } from "@/components/UI/Skeleton";
import HeroFeaturedCarSkeleton from "@/components/UI/Skeleton/HeroFeaturedCarSkeleton";

interface HeroFeaturedCarWrapperProps {
  children: React.ReactNode;
}

const HeroFeaturedCarWrapper: React.FC<HeroFeaturedCarWrapperProps> = ({
  children,
}) => {
  const isLoading = useSkeleton(1000, 3000);

  return (
    <SkeletonWrapper isLoading={isLoading} skeleton={<HeroFeaturedCarSkeleton />}>
      {children}
    </SkeletonWrapper>
  );
};

export default HeroFeaturedCarWrapper;
