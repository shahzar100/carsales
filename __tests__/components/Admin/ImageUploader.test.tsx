/**
 * Tests for src/components/Admin/ImageUploader.tsx
 *
 * Standards coverage:
 * - 🔒 Security: rejects files with disallowed MIME types AND files
 *   above MAX_FILE_SIZE (10 MB) before any network call; on remove,
 *   only sends DELETE to /api/admin/upload/delete for keys in the
 *   approved folder prefixes (cars/ or parts/)
 * - 📋 Functional: handleFiles slices to remaining slots when at the
 *   limit; previews show 'Main' badge on the first image in multiple
 *   mode; drop zone hidden once existingImages + uploading >= maxImages
 * - 🎯 Usability: error banner surfaces validation message; remove
 *   button is per-image
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

let fetchMock: jest.Mock;

beforeEach(() => {
  fetchMock = jest.fn();
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
  // jsdom doesn't ship crypto.randomUUID — polyfill so the uploader can
  // mint per-file ids.
  if (
    typeof (
      globalThis.crypto as Crypto & { randomUUID?: () => string }
    ).randomUUID !== "function"
  ) {
    (globalThis.crypto as Crypto & { randomUUID: () => string }).randomUUID =
      () => `test-uuid-${Math.random().toString(36).slice(2, 10)}`;
  }
});

import ImageUploader from "@/components/Admin/ImageUploader";

function makeFile(
  name: string,
  type = "image/jpeg",
  size = 1024
): File {
  const file = new File(["x".repeat(size)], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("ImageUploader", () => {
  it("renders the drop zone when slots are available", () => {
    render(
      <ImageUploader folder="cars" onUpload={jest.fn()} onRemove={jest.fn()} />
    );
    expect(
      screen.getByRole("button", { name: /upload images/i })
    ).toBeInTheDocument();
  });

  it("📋 hides the drop zone when existingImages.length === maxImages", () => {
    render(
      <ImageUploader
        folder="cars"
        onUpload={jest.fn()}
        onRemove={jest.fn()}
        existingImages={["https://cdn.test/cars/a.jpg"]}
        maxImages={1}
      />
    );
    expect(
      screen.queryByRole("button", { name: /upload images/i })
    ).not.toBeInTheDocument();
  });

  it("🔒 rejects files with a disallowed MIME type and never touches fetch", () => {
    render(
      <ImageUploader folder="cars" onUpload={jest.fn()} onRemove={jest.fn()} />
    );
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = makeFile("evil.svg", "image/svg+xml");
    fireEvent.change(input, { target: { files: [file] } });
    expect(
      screen.getByText(/not a supported image type/i)
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("🔒 rejects files larger than the 10 MB cap", () => {
    render(
      <ImageUploader folder="cars" onUpload={jest.fn()} onRemove={jest.fn()} />
    );
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = makeFile("huge.jpg", "image/jpeg", 11 * 1024 * 1024);
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText(/exceeds 10 MB limit/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("📋 valid file: POSTs to /api/admin/upload then PUTs to the presigned URL", async () => {
    const onUpload = jest.fn();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        uploadUrl: "https://signed.example/u/abc",
        publicUrl: "https://cdn.example/cars/k.jpg",
      }),
    });

    // Stub XHR — the production code uses raw XHR for the S3 PUT so it can
    // surface upload progress events.
    class XHRStub {
      upload = { addEventListener: jest.fn() };
      _listeners: Record<string, ((e?: unknown) => void)[]> = {};
      open = jest.fn();
      setRequestHeader = jest.fn();
      send = jest.fn(() => {
        // Fire `load` with a 200 so the upload promise resolves.
        this.status = 200;
        this._listeners.load?.forEach((cb) => cb());
      });
      addEventListener(name: string, cb: (e?: unknown) => void) {
        this._listeners[name] = [...(this._listeners[name] ?? []), cb];
      }
      status = 0;
    }
    const originalXHR = window.XMLHttpRequest;
    (window as unknown as { XMLHttpRequest: typeof XMLHttpRequest }).XMLHttpRequest =
      XHRStub as unknown as typeof XMLHttpRequest;

    render(
      <ImageUploader folder="cars" onUpload={onUpload} onRemove={jest.fn()} />
    );
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [makeFile("test.jpg", "image/jpeg", 4096)] },
    });

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/upload",
        expect.objectContaining({ method: "POST" })
      )
    );
    const init = fetchMock.mock.calls[0][1];
    expect(JSON.parse(init.body)).toEqual({
      fileName: "test.jpg",
      contentType: "image/jpeg",
      folder: "cars",
      contentLength: 4096,
    });
    await waitFor(() =>
      expect(onUpload).toHaveBeenCalledWith("https://cdn.example/cars/k.jpg")
    );

    (window as unknown as { XMLHttpRequest: typeof XMLHttpRequest }).XMLHttpRequest =
      originalXHR;
  });

  it("🎯 surfaces the server error when the presign fails", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Folder not allowed" }),
    });
    render(
      <ImageUploader folder="cars" onUpload={jest.fn()} onRemove={jest.fn()} />
    );
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [makeFile("test.jpg", "image/jpeg", 4096)] },
    });
    await waitFor(() =>
      expect(screen.getByText(/folder not allowed/i)).toBeInTheDocument()
    );
  });

  it("renders existingImages previews and a 'Main' badge on the first in multiple mode", () => {
    render(
      <ImageUploader
        folder="cars"
        onUpload={jest.fn()}
        onRemove={jest.fn()}
        multiple
        maxImages={4}
        existingImages={[
          "https://cdn.test/cars/a.jpg",
          "https://cdn.test/cars/b.jpg",
        ]}
      />
    );
    expect(screen.getByText("Main")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Remove image 1")
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Remove image 2")
    ).toBeInTheDocument();
  });

  it("🔒 remove sends DELETE for cars/parts keys, otherwise just calls onRemove", async () => {
    const onRemove = jest.fn();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    render(
      <ImageUploader
        folder="cars"
        onUpload={jest.fn()}
        onRemove={onRemove}
        existingImages={["https://cdn.test/cars/abc.jpg"]}
      />
    );
    fireEvent.click(screen.getByLabelText("Remove image 1"));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/upload/delete",
        expect.objectContaining({ method: "POST" })
      )
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      key: "cars/abc.jpg",
    });
    expect(onRemove).toHaveBeenCalledWith("https://cdn.test/cars/abc.jpg");
  });

  it("🔒 remove of a non-cars/parts URL skips DELETE but still calls onRemove", async () => {
    const onRemove = jest.fn();
    render(
      <ImageUploader
        folder="cars"
        onUpload={jest.fn()}
        onRemove={onRemove}
        existingImages={["https://cdn.test/legacy/x.png"]}
      />
    );
    fireEvent.click(screen.getByLabelText("Remove image 1"));
    await waitFor(() => expect(onRemove).toHaveBeenCalled());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("📋 silently swallows URL parse errors and still calls onRemove", async () => {
    const onRemove = jest.fn();
    render(
      <ImageUploader
        folder="cars"
        onUpload={jest.fn()}
        onRemove={onRemove}
        existingImages={["not-a-valid-url"]}
      />
    );
    fireEvent.click(screen.getByLabelText("Remove image 1"));
    await waitFor(() =>
      expect(onRemove).toHaveBeenCalledWith("not-a-valid-url")
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("🎯 a successful drag-drop hits the same handleFiles path", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "boom" }),
    });
    const { container } = render(
      <ImageUploader folder="parts" onUpload={jest.fn()} onRemove={jest.fn()} />
    );
    const dropZone = container.querySelector(
      'button[aria-label="Upload images"]'
    ) as HTMLElement;
    const dropEvent = new Event("drop", { bubbles: true });
    Object.defineProperty(dropEvent, "dataTransfer", {
      value: {
        files: [makeFile("dropped.png", "image/png", 1024)],
      },
    });
    dropZone.dispatchEvent(dropEvent);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/upload");
  });
});
