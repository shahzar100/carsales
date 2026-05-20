/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { GET } from "@/app/api/cars/route";
import { getTestCollections, createTestCar } from "../utils/testUtils";

describe("/api/cars", () => {
  afterEach(async () => {
    const { client } = await getTestCollections();
    await client.close();
  });

  describe("GET", () => {
    it("returns available cars matching the requested ids", async () => {
      const { cars, client } = await getTestCollections();
      const available = await cars.insertOne(
        createTestCar({ make: "Tesla", model: "Model 3", status: "available" })
      );
      const alsoAvailable = await cars.insertOne(
        createTestCar({ make: "Audi", model: "A4", status: "available" })
      );
      await client.close();

      const request = new NextRequest(
        `http://localhost:3000/api/cars?ids=${available.insertedId},${alsoAvailable.insertedId}`
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.cars).toHaveLength(2);
      expect(data.data.cars.map((c: { make: string }) => c.make).sort()).toEqual(
        ["Audi", "Tesla"]
      );
    });

    it("excludes sold/reserved cars so they drop off the saved list", async () => {
      const { cars, client } = await getTestCollections();
      const available = await cars.insertOne(
        createTestCar({ make: "Tesla", status: "available" })
      );
      const sold = await cars.insertOne(
        createTestCar({ make: "BMW", status: "sold" })
      );
      await client.close();

      const request = new NextRequest(
        `http://localhost:3000/api/cars?ids=${available.insertedId},${sold.insertedId}`
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.cars).toHaveLength(1);
      expect(data.data.cars[0].make).toBe("Tesla");
    });

    it("returns 400 when no ids parameter is supplied", async () => {
      const request = new NextRequest("http://localhost:3000/api/cars");
      const response = await GET(request);
      expect(response.status).toBe(400);
    });

    it("returns an empty list when no ids are valid ObjectIds", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/cars?ids=not-an-id,also-bad"
      );
      const response = await GET(request);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.data.cars).toEqual([]);
    });
  });
});
