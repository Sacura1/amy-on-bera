import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://amy-production-fd10.up.railway.app';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathname = path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${API_BASE_URL}/${pathname}${searchParams ? `?${searchParams}` : ''}`;

  // Check if this is a static file request (images, etc.)
  const isStaticFile = pathname.startsWith('uploads/') ||
    /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(pathname);

  try {
    const headers: HeadersInit = {};

    // Only set JSON headers for API requests, not static files
    if (!isStaticFile) {
      headers['Content-Type'] = 'application/json';
      headers['Accept'] = 'application/json';
    }

    const response = await fetch(url, { headers });

    // Handle static files (images)
    if (isStaticFile) {
      if (!response.ok) {
        console.error(`Static file not found: ${url}, status: ${response.status}`);
        return new NextResponse(null, { status: response.status });
      }

      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const buffer = await response.arrayBuffer();

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // Try to get JSON response and pass through the actual error
    const responseContentType = response.headers.get('content-type');
    if (responseContentType && responseContentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    // Non-JSON response
    if (!response.ok) {
      const text = await response.text();
      console.error(`API returned ${response.status} for ${url}:`, text.substring(0, 200));
      return NextResponse.json(
        { error: `API error: ${response.status}`, details: text.substring(0, 200) },
        { status: response.status }
      );
    }

    const text = await response.text();
    return new NextResponse(text, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Proxy request failed', details: String(error) }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathname = path.join('/');
  const url = `${API_BASE_URL}/${pathname}`;

  const requestContentType = request.headers.get('content-type') || '';

  try {
    let response;

    // Handle FormData (multipart) uploads differently
    if (requestContentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
    } else {
      // JSON request
      let body;
      try {
        body = await request.json();
      } catch {
        body = {};
      }

      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });
    }

    // Try to get JSON response and pass through the actual error
    const responseContentType = response.headers.get('content-type');
    if (responseContentType && responseContentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    // Non-JSON response
    if (!response.ok) {
      const text = await response.text();
      console.error(`API returned ${response.status} for POST ${url}:`, text.substring(0, 200));
      return NextResponse.json(
        { error: `API error: ${response.status}`, details: text.substring(0, 200) },
        { status: response.status }
      );
    }

    const text = await response.text();
    return new NextResponse(text, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Proxy request failed', details: String(error) }, { status: 500 });
  }
}
