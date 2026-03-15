"use client";
import React from "react";
import { useSkeleton } from "@/hooks/useSkeleton";
import { SkeletonWrapper } from "@/components/UI/Skeleton";
import { PackageCardSkeletonGrid } from "@/components/UI/Skeleton/PackageCardSkeleton";

interface PackageGridWrapperProps {
  children: React.ReactNode;
  /** Number of skeleton cards to show (default 3) */
  count?: number;
  /** Grid columns (default 3) */
  columns?: 2 | 3;
  /** Which card index looks "popular" in the skeleton (default 1) */
  popularIndex?: number;
}

const PackageGridWrapper: React.FC<PackageGridWrapperProps> = ({
  children,
  count = 3,
  columns = 3,
  popularIndex = 1,
}) => {
  const isLoading = useSkeleton(1000, 3000);

  return (
    <SkeletonWrapper
      isLoading={isLoading}
      skeleton={
        <PackageCardSkeletonGrid
          count={count}
          columns={columns}
          popularIndex={popularIndex}
        />
      }
    >
      {children}
    </SkeletonWrapper>
  );
};

export default PackageGridWrapper;
