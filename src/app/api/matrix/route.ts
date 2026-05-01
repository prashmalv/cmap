import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

const MATRIX_PATH = path.join(process.cwd(), "src/data/career-matrix.json");

function loadMatrix() {
  return JSON.parse(readFileSync(MATRIX_PATH, "utf-8"));
}

function saveMatrix(data: unknown) {
  writeFileSync(MATRIX_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// GET all careers or a single career
export async function GET() {
  try {
    const matrix = loadMatrix();
    return NextResponse.json({ careers: matrix.careers, version: matrix.version });
  } catch {
    return NextResponse.json({ error: "Failed to read matrix" }, { status: 500 });
  }
}

// POST — add a new career
export async function POST(req: NextRequest) {
  try {
    const newCareer = await req.json();

    if (!newCareer.id || !newCareer.title || !newCareer.category) {
      return NextResponse.json(
        { error: "id, title, and category are required" },
        { status: 400 }
      );
    }

    const matrix = loadMatrix();
    const exists = matrix.careers.find((c: { id: string }) => c.id === newCareer.id);
    if (exists) {
      return NextResponse.json({ error: "Career with this id already exists" }, { status: 409 });
    }

    matrix.careers.push(newCareer);
    matrix.last_updated = new Date().toISOString().split("T")[0];
    saveMatrix(matrix);

    return NextResponse.json({ success: true, career: newCareer }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to add career" }, { status: 500 });
  }
}

// PUT — update an existing career
export async function PUT(req: NextRequest) {
  try {
    const updated = await req.json();
    if (!updated.id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const matrix = loadMatrix();
    const idx = matrix.careers.findIndex((c: { id: string }) => c.id === updated.id);
    if (idx === -1) return NextResponse.json({ error: "Career not found" }, { status: 404 });

    matrix.careers[idx] = { ...matrix.careers[idx], ...updated };
    matrix.last_updated = new Date().toISOString().split("T")[0];
    saveMatrix(matrix);

    return NextResponse.json({ success: true, career: matrix.careers[idx] });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE — remove a career
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const matrix = loadMatrix();
    const before = matrix.careers.length;
    matrix.careers = matrix.careers.filter((c: { id: string }) => c.id !== id);

    if (matrix.careers.length === before) {
      return NextResponse.json({ error: "Career not found" }, { status: 404 });
    }

    matrix.last_updated = new Date().toISOString().split("T")[0];
    saveMatrix(matrix);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
