import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FilterSelect from "@/components/Helpful/FilterSelect";

const options = [
  { value: "toyota", label: "Toyota" },
  { value: "honda", label: "Honda" },
  { value: "bmw", label: "BMW" },
];

describe("FilterSelect", () => {
  it("renders label", () => {
    render(
      <FilterSelect
        label="Make"
        value="all"
        onChange={jest.fn()}
        options={options}
      />
    );
    expect(screen.getByText("Make")).toBeInTheDocument();
  });

  it("renders placeholder option", () => {
    render(
      <FilterSelect
        label="Make"
        value="all"
        onChange={jest.fn()}
        options={options}
        placeholder="All Makes"
      />
    );
    expect(screen.getByText("All Makes")).toBeInTheDocument();
  });

  it("renders all options", () => {
    render(
      <FilterSelect
        label="Make"
        value="all"
        onChange={jest.fn()}
        options={options}
      />
    );
    const select = screen.getByRole("combobox");
    // "All" placeholder + 3 options = 4
    expect(select.querySelectorAll("option")).toHaveLength(4);
  });

  it("calls onChange when value changes", () => {
    const onChange = jest.fn();
    render(
      <FilterSelect
        label="Make"
        value="all"
        onChange={onChange}
        options={options}
      />
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "toyota" },
    });
    expect(onChange).toHaveBeenCalledWith("toyota");
  });

  it("shows selected value", () => {
    render(
      <FilterSelect
        label="Make"
        value="honda"
        onChange={jest.fn()}
        options={options}
      />
    );
    expect(screen.getByRole("combobox")).toHaveValue("honda");
  });
});
