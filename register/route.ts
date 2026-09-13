import { NextResponse } from "next/server";

const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwePscZ2zyVQRAKjLyhkeqGqDgOqhvHBneisqrSkIQ460accM8YxRBVFlzV8fyARwmOr/exec";

export async function POST(request: Request) {
    try {
        const body = await request.text();

        if (!body) {
            return NextResponse.json(
                {
                    result: "error",
                    message: "Request data उपलब्ध नाही.",
                },
                { status: 400 }
            );
        }

        const response = await fetch(
            GOOGLE_SCRIPT_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "text/plain;charset=utf-8",
                },

                body,
                redirect: "follow",

                cache: "no-store",
            }
        );

        const responseText =
            await response.text();

        if (!response.ok) {
            return NextResponse.json(
                {
                    result: "error",
                    message:
                        "Google Apps Script कडून response मिळाला नाही.",
                    status: response.status,
                    details: responseText,
                },
                {
                    status: 502,
                }
            );
        }

        let result;

        try {
            result =
                JSON.parse(responseText);
        } catch {
            return NextResponse.json(
                {
                    result: "error",
                    message:
                        "Google Apps Script चा response JSON format मध्ये नाही.",
                    details: responseText,
                },
                {
                    status: 502,
                }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error(
            "Google Apps Script Proxy Error:",
            error
        );

        return NextResponse.json(
            {
                result: "error",
                message:
                    error instanceof Error
                        ? error.message
                        : "Server error आला.",
            },
            {
                status: 500,
            }
        );
    }
}