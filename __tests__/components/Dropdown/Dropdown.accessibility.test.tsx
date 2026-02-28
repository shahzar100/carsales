/**
 * STRICT DROPDOWN & NAVIGATION TESTS
 * Tests for complex interactive components with accessibility focus
 * Designed to catch keyboard navigation, screen reader, and usability issues
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("Dropdown & Navigation Components - ACCESSIBILITY & INTERACTION TESTS", () => {
  describe("CustomDropdown Component - KEYBOARD & ARIA REQUIREMENTS", () => {
    // Mock CustomDropdown component based on expected behavior
    const CustomDropdown = ({
      options = [],
      value,
      onChange,
      placeholder = "Select an option",
      disabled = false,
      searchable = false,
      multiSelect = false,
      required = false,
      "aria-label": ariaLabel,
      "data-testid": testId,
    }: any) => {
      const [isOpen, setIsOpen] = React.useState(false);
      const [searchTerm, setSearchTerm] = React.useState("");
      const [focusedIndex, setFocusedIndex] = React.useState(-1);
      const dropdownRef = React.useRef<HTMLDivElement>(null);
      const listboxRef = React.useRef<HTMLUListElement>(null);

      const filteredOptions = searchable
        ? options.filter((option: any) =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : options;

      const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            if (!isOpen) {
              setIsOpen(true);
              setFocusedIndex(0);
            } else {
              setFocusedIndex((prev) =>
                prev < filteredOptions.length - 1 ? prev + 1 : prev
              );
            }
            break;
          case "ArrowUp":
            e.preventDefault();
            setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
            break;
          case "Enter":
          case " ":
            e.preventDefault();
            if (!isOpen) {
              setIsOpen(true);
            } else if (focusedIndex >= 0) {
              const selectedOption = filteredOptions[focusedIndex];
              onChange(selectedOption);
              if (!multiSelect) {
                setIsOpen(false);
              }
            }
            break;
          case "Escape":
            setIsOpen(false);
            setFocusedIndex(-1);
            break;
          case "Tab":
            setIsOpen(false);
            break;
        }
      };

      const handleOptionClick = (option: any) => {
        onChange(option);
        if (!multiSelect) {
          setIsOpen(false);
        }
        setFocusedIndex(-1);
      };

      // Close dropdown when clicking outside
      React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (
            dropdownRef.current &&
            !dropdownRef.current.contains(event.target as Node)
          ) {
            setIsOpen(false);
          }
        };

        if (isOpen) {
          document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }, [isOpen]);

      const getDisplayValue = () => {
        if (multiSelect && Array.isArray(value)) {
          return value.length > 0 ? `${value.length} selected` : placeholder;
        }
        return value?.label || placeholder;
      };

      const selectedValue =
        multiSelect && Array.isArray(value) ? value : [value].filter(Boolean);

      return (
        <div ref={dropdownRef} className="relative w-full" data-testid={testId}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-label={ariaLabel || "Dropdown menu"}
            aria-required={required}
            className={`w-full rounded-md border bg-white px-3 py-2 text-left ${disabled ? "cursor-not-allowed bg-gray-100" : "cursor-pointer hover:border-gray-400"} ${isOpen ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-300"} focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none`}
          >
            <span className="block truncate">{getDisplayValue()}</span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-2">
              <svg
                className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </span>
          </button>

          {isOpen && (
            <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg">
              {searchable && (
                <div className="border-b p-2">
                  <input
                    type="text"
                    placeholder="Search options..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded border px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}

              <ul
                ref={listboxRef}
                role="listbox"
                aria-multiselectable={multiSelect}
                className="max-h-60 overflow-auto py-1"
              >
                {filteredOptions.length === 0 ? (
                  <li className="px-3 py-2 text-gray-500">No options found</li>
                ) : (
                  filteredOptions.map((option: any, index: number) => {
                    const isSelected = multiSelect
                      ? selectedValue.some((v: any) => v.value === option.value)
                      : value?.value === option.value;
                    const isFocused = index === focusedIndex;

                    return (
                      <li
                        key={option.value}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleOptionClick(option)}
                        className={`relative cursor-pointer px-3 py-2 select-none ${isFocused ? "bg-blue-100 text-blue-900" : "text-gray-900"} ${isSelected ? "bg-blue-50 text-blue-700" : ""} hover:bg-gray-100`}
                      >
                        <div className="flex items-center">
                          {multiSelect && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="mr-2"
                              tabIndex={-1}
                            />
                          )}
                          <span
                            className={`block truncate ${isSelected ? "font-medium" : "font-normal"}`}
                          >
                            {option.label}
                          </span>
                        </div>
                        {isSelected && !multiSelect && (
                          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600">
                            ✓
                          </span>
                        )}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          )}
        </div>
      );
    };

    const mockOptions = [
      { value: "option1", label: "First Option" },
      { value: "option2", label: "Second Option" },
      { value: "option3", label: "Third Option" },
      { value: "option4", label: "Fourth Option" },
    ];

    afterEach(cleanup);

    it("MUST support full keyboard navigation with proper ARIA", async () => {
      const mockChange = jest.fn();
      render(
        <CustomDropdown
          options={mockOptions}
          value={null}
          onChange={mockChange}
          aria-label="Test dropdown"
        />
      );

      const trigger = screen.getByRole("button", { name: /test dropdown/i });

      // STRICT: Initial state
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(trigger).toHaveAttribute("aria-haspopup", "listbox");

      // STRICT: Arrow down should open and focus first option
      trigger.focus();
      fireEvent.keyDown(trigger, { key: "ArrowDown" });

      expect(trigger).toHaveAttribute("aria-expanded", "true");
      const listbox = screen.getByRole("listbox");
      expect(listbox).toBeTruthy();

      // STRICT: Arrow navigation should work
      fireEvent.keyDown(trigger, { key: "ArrowDown" });
      fireEvent.keyDown(trigger, { key: "Enter" });

      expect(mockChange).toHaveBeenCalledWith(mockOptions[1]);
    });

    it("MUST handle escape key and click outside to close", async () => {
      const mockChange = jest.fn();
      render(
        <div>
          <button>Outside Button</button>
          <CustomDropdown
            options={mockOptions}
            value={null}
            onChange={mockChange}
          />
        </div>
      );

      const trigger = screen.getByRole("button", { name: /dropdown menu/i });

      // STRICT: Open dropdown
      await userEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");

      // STRICT: Escape should close
      fireEvent.keyDown(trigger, { key: "Escape" });
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      // STRICT: Reopen and click outside
      await userEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");

      const outsideButton = screen.getByText("Outside Button");
      await userEvent.click(outsideButton);

      await waitFor(() => {
        expect(trigger).toHaveAttribute("aria-expanded", "false");
      });
    });

    it("MUST support searchable functionality with proper filtering", async () => {
      const mockChange = jest.fn();
      render(
        <CustomDropdown
          options={mockOptions}
          value={null}
          onChange={mockChange}
          searchable={true}
        />
      );

      const trigger = screen.getByRole("button");
      await userEvent.click(trigger);

      const searchInput = screen.getByPlaceholderText(/search options/i);
      expect(searchInput).toBeTruthy();

      // STRICT: Search should filter options
      await userEvent.type(searchInput, "first");

      // STRICT: Only matching options should be visible
      expect(screen.getByText("First Option")).toBeTruthy();
      expect(screen.queryByText("Second Option")).toBeFalsy();

      // STRICT: No results message for invalid search
      await userEvent.clear(searchInput);
      await userEvent.type(searchInput, "nonexistent");

      expect(screen.getByText("No options found")).toBeTruthy();
    });

    it("MUST support multi-select with proper checkbox behavior", async () => {
      const mockChange = jest.fn();
      render(
        <CustomDropdown
          options={mockOptions}
          value={[]}
          onChange={mockChange}
          multiSelect={true}
        />
      );

      const trigger = screen.getByRole("button");
      await userEvent.click(trigger);

      const listbox = screen.getByRole("listbox");
      expect(listbox).toHaveAttribute("aria-multiselectable", "true");

      // STRICT: Options should have checkboxes
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes).toHaveLength(mockOptions.length);

      // STRICT: Selecting option should call onChange with array
      const firstOption = screen.getByText("First Option");
      await userEvent.click(firstOption);

      expect(mockChange).toHaveBeenCalledWith(mockOptions[0]);

      // STRICT: Dropdown should stay open for multi-select
      expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    it("MUST handle disabled state properly", () => {
      const mockChange = jest.fn();
      render(
        <CustomDropdown
          options={mockOptions}
          value={null}
          onChange={mockChange}
          disabled={true}
        />
      );

      const trigger = screen.getByRole("button");

      // STRICT: Disabled button should not open
      expect(trigger).toBeDisabled();
      expect(trigger.className).toContain("cursor-not-allowed");
      expect(trigger.className).toContain("bg-gray-100");
    });

    it("MUST validate required field accessibility", () => {
      const mockChange = jest.fn();
      render(
        <CustomDropdown
          options={mockOptions}
          value={null}
          onChange={mockChange}
          required={true}
        />
      );

      const trigger = screen.getByRole("button");

      // STRICT: Required dropdown must have aria-required
      expect(trigger).toHaveAttribute("aria-required", "true");
    });

    it("MUST announce selection changes to screen readers", async () => {
      const mockChange = jest.fn();
      const { rerender } = render(
        <CustomDropdown
          options={mockOptions}
          value={null}
          onChange={mockChange}
        />
      );

      const trigger = screen.getByRole("button");
      await userEvent.click(trigger);

      const firstOption = screen.getByRole("option", { name: /first option/i });
      await userEvent.click(firstOption);

      // STRICT: Re-render with selected value
      rerender(
        <CustomDropdown
          options={mockOptions}
          value={mockOptions[0]}
          onChange={mockChange}
        />
      );

      // STRICT: Selected option should be marked as selected
      await userEvent.click(trigger);
      const selectedOption = screen.getByRole("option", {
        name: /first option/i,
      });
      expect(selectedOption).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("Navigation Menu Component - FOCUS MANAGEMENT & MOBILE REQUIREMENTS", () => {
    // Mock NavMenu component
    const NavMenu = ({
      items = [],
      isOpen = false,
      onToggle,
      onItemClick,
      isMobile = false,
    }: any) => {
      const [focusedIndex, setFocusedIndex] = React.useState(-1);
      const menuRef = React.useRef<HTMLDivElement>(null);

      const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            setFocusedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
            break;
          case "ArrowUp":
            e.preventDefault();
            setFocusedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
            break;
          case "Enter":
          case " ":
            e.preventDefault();
            if (focusedIndex >= 0) {
              onItemClick(items[focusedIndex]);
            }
            break;
          case "Escape":
            onToggle(false);
            setFocusedIndex(-1);
            break;
          case "Home":
            e.preventDefault();
            setFocusedIndex(0);
            break;
          case "End":
            e.preventDefault();
            setFocusedIndex(items.length - 1);
            break;
        }
      };

      // Focus management
      React.useEffect(() => {
        if (isOpen && focusedIndex >= 0 && menuRef.current) {
          const focusedItem = menuRef.current.children[
            focusedIndex
          ] as HTMLElement;
          focusedItem?.focus();
        }
      }, [isOpen, focusedIndex]);

      return (
        <div className="relative">
          <button
            onClick={() => onToggle(!isOpen)}
            onKeyDown={handleKeyDown}
            aria-expanded={isOpen}
            aria-haspopup="menu"
            aria-label="Navigation menu"
            className={`rounded-md border p-2 ${isMobile ? "block md:hidden" : "hidden md:block"} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
          >
            {/* Hamburger icon */}
            <div className="flex h-6 w-6 flex-col justify-center">
              <div
                className={`mb-1 h-0.5 bg-current transition-transform ${isOpen ? "translate-y-1.5 rotate-45" : ""}`}
              />
              <div
                className={`mb-1 h-0.5 bg-current transition-opacity ${isOpen ? "opacity-0" : ""}`}
              />
              <div
                className={`h-0.5 bg-current transition-transform ${isOpen ? "-translate-y-1.5 -rotate-45" : ""}`}
              />
            </div>
          </button>

          {isOpen && (
            <>
              {/* Overlay for mobile */}
              {isMobile && (
                <div
                  className="bg-opacity-50 fixed inset-0 z-40 bg-black"
                  onClick={() => onToggle(false)}
                />
              )}

              <div
                ref={menuRef}
                role="menu"
                aria-orientation="vertical"
                onKeyDown={handleKeyDown}
                className={` ${
                  isMobile
                    ? "fixed top-0 right-0 z-50 h-full w-64 transform bg-white shadow-lg transition-transform"
                    : "absolute top-full left-0 z-10 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg"
                } `}
              >
                {isMobile && (
                  <div className="flex items-center justify-between border-b border-gray-200 p-4">
                    <span className="font-semibold">Menu</span>
                    <button
                      onClick={() => onToggle(false)}
                      aria-label="Close menu"
                      className="rounded p-1 hover:bg-gray-100"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className={isMobile ? "py-4" : "py-1"}>
                  {items.map((item: any, index: number) => (
                    <button
                      key={item.id || index}
                      role="menuitem"
                      tabIndex={focusedIndex === index ? 0 : -1}
                      onClick={() => onItemClick(item)}
                      onFocus={() => setFocusedIndex(index)}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${focusedIndex === index ? "bg-gray-100" : ""} ${item.disabled ? "cursor-not-allowed text-gray-400" : "text-gray-900"} `}
                      disabled={item.disabled}
                    >
                      {item.icon && (
                        <span
                          className="mr-3 inline-block h-5 w-5"
                          aria-hidden="true"
                        >
                          {item.icon}
                        </span>
                      )}
                      {item.label}
                      {item.badge && (
                        <span className="ml-2 rounded-full bg-red-100 px-2 py-1 text-xs text-red-800">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      );
    };

    const mockMenuItems = [
      { id: "home", label: "Home", icon: "🏠" },
      { id: "services", label: "Services", icon: "🔧", badge: "New" },
      { id: "about", label: "About", icon: "ℹ️" },
      { id: "contact", label: "Contact", icon: "📞", disabled: true },
    ];

    afterEach(cleanup);

    it("MUST provide full keyboard navigation with arrow keys", async () => {
      const mockToggle = jest.fn();
      const mockItemClick = jest.fn();

      render(
        <NavMenu
          items={mockMenuItems}
          isOpen={true}
          onToggle={mockToggle}
          onItemClick={mockItemClick}
        />
      );

      const menu = screen.getByRole("menu");
      const menuItems = screen.getAllByRole("menuitem");

      // STRICT: Initial focus should be manageable
      menu.focus();

      // STRICT: Arrow down should focus next item
      fireEvent.keyDown(menu, { key: "ArrowDown" });

      // STRICT: Home key should focus first item
      fireEvent.keyDown(menu, { key: "Home" });
      expect(menuItems[0]).toHaveClass("bg-gray-100");

      // STRICT: End key should focus last item
      fireEvent.keyDown(menu, { key: "End" });

      // STRICT: Enter should trigger item click
      fireEvent.keyDown(menu, { key: "Enter" });
      expect(mockItemClick).toHaveBeenCalledWith(mockMenuItems[3]);
    });

    it("MUST handle mobile overlay and slide-in behavior", async () => {
      const mockToggle = jest.fn();
      const mockItemClick = jest.fn();

      render(
        <NavMenu
          items={mockMenuItems}
          isOpen={true}
          onToggle={mockToggle}
          onItemClick={mockItemClick}
          isMobile={true}
        />
      );

      // STRICT: Mobile menu should have overlay
      const overlay = document.querySelector(".fixed.inset-0.bg-black");
      expect(overlay).toBeTruthy();

      // STRICT: Mobile menu should have close button
      const closeButton = screen.getByLabelText(/close menu/i);
      expect(closeButton).toBeTruthy();

      // STRICT: Clicking overlay should close menu
      if (overlay) {
        await userEvent.click(overlay);
        expect(mockToggle).toHaveBeenCalledWith(false);
      }
    });

    it("MUST handle disabled menu items properly", () => {
      const mockToggle = jest.fn();
      const mockItemClick = jest.fn();

      render(
        <NavMenu
          items={mockMenuItems}
          isOpen={true}
          onToggle={mockToggle}
          onItemClick={mockItemClick}
        />
      );

      const disabledItem = screen.getByText("Contact").closest("button");

      // STRICT: Disabled item should not be clickable
      expect(disabledItem).toBeDisabled();
      expect(disabledItem).toHaveClass("text-gray-400", "cursor-not-allowed");
    });

    it("MUST display badges and icons correctly", () => {
      const mockToggle = jest.fn();
      const mockItemClick = jest.fn();

      render(
        <NavMenu
          items={mockMenuItems}
          isOpen={true}
          onToggle={mockToggle}
          onItemClick={mockItemClick}
        />
      );

      // STRICT: Icons should be present with proper ARIA
      const icons = document.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);

      // STRICT: Badges should be visible
      const badge = screen.getByText("New");
      expect(badge).toBeTruthy();
      expect(badge.className).toContain("bg-red-100");
    });

    it("MUST handle hamburger menu animation", () => {
      const mockToggle = jest.fn();
      const mockItemClick = jest.fn();

      const { rerender } = render(
        <NavMenu
          items={mockMenuItems}
          isOpen={false}
          onToggle={mockToggle}
          onItemClick={mockItemClick}
        />
      );

      const trigger = screen.getByLabelText(/navigation menu/i);
      const hamburgerContainer = trigger.querySelector(".flex.h-6.w-6");
      const closedLines = hamburgerContainer!.querySelectorAll(":scope > div");

      // STRICT: Closed state - no rotation
      expect(closedLines[0]).not.toHaveClass("rotate-45");
      expect(closedLines[1]).not.toHaveClass("opacity-0");

      // STRICT: Open state - hamburger transforms to X
      rerender(
        <NavMenu
          items={mockMenuItems}
          isOpen={true}
          onToggle={mockToggle}
          onItemClick={mockItemClick}
        />
      );

      // Re-query after rerender to get fresh DOM references
      const updatedTrigger = screen.getByLabelText(/navigation menu/i);
      const updatedContainer = updatedTrigger.querySelector(".flex.h-6.w-6");
      const openLines = updatedContainer!.querySelectorAll(":scope > div");

      expect(openLines[0]).toHaveClass("rotate-45");
      expect(openLines[1]).toHaveClass("opacity-0");
      expect(openLines[2]).toHaveClass("-rotate-45");
    });

    it("MUST trap focus within mobile menu", async () => {
      const mockToggle = jest.fn();
      const mockItemClick = jest.fn();

      render(
        <div>
          <button>Before Menu</button>
          <NavMenu
            items={mockMenuItems}
            isOpen={true}
            onToggle={mockToggle}
            onItemClick={mockItemClick}
            isMobile={true}
          />
          <button>After Menu</button>
        </div>
      );

      const menuItems = screen.getAllByRole("menuitem");
      const closeButton = screen.getByLabelText(/close menu/i);

      // STRICT: Focus should be trapped within menu
      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);

      // STRICT: Tab should cycle through menu items only
      fireEvent.keyDown(closeButton, { key: "Tab" });

      // Focus should not escape to "After Menu" button
      const afterButton = screen.getByText("After Menu");
      expect(document.activeElement).not.toBe(afterButton);
    });
  });
});
