import React, { Suspense } from "react";
import ShopItems from "../../components/Shop/Collection/ShopItems";
import Loading from "./Loading";

const ShopPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<Loading />}>
        <ShopItems />
      </Suspense>
    </div>
  );
};

export default ShopPage;
