import { NextRequest, NextResponse } from "next/server";
import { avalancheFuji } from "viem/chains";
import {
  createMetadata,
  Metadata,
  ValidatedMetadata,
  ExecutionResponse,
} from "@sherrylinks/sdk";
import { serialize } from "wagmi";
import { abi } from "@/blockchain/abi";
import {Transaction } from "viem";

const CONTRACT_ADDRESS = "0x26480A86d47096Cf19F1be6129546aD715Ca68D9";

export async function GET(req: NextRequest) {
  try {
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const serverUrl = `${protocol}://${host}`;

    const metadata: Metadata = {
      url: "https://sherry.social",
      icon: "https://avatars.githubusercontent.com/u/117962315",
      title: "Mensaje con Timestamp",
      baseUrl: serverUrl,
      description:
        "Almacena un mensaje con un timestamp optimizado calculado por nuestro algoritmo",
      actions: [
        {
          type: "dynamic",
          label: "Almacenar Mensaje",
          description:
            "Almacena tu mensaje con un timestamp personalizado calculado para almacenamiento óptimo",
          chains: { source: "fuji" },
          path: `/api/example`,
          params: [
            {
              name: "mensaje",
              label: "¡Tu Mensaje Hermano!",
              type: "text",
              required: true,
              description:
                "Ingresa el mensaje que quieres almacenar en la blockchain",
            },
          ],
        },
      ],
    };

    // Validar metadata usando el SDK
    const validated: ValidatedMetadata = createMetadata(metadata);

    // Retornar con headers CORS para acceso cross-origin
    return NextResponse.json(validated, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      },
    });
  } catch (error) {
    console.error("Error creando metadata:", error);
    return NextResponse.json(
      { error: "Error al crear metadata" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const message = searchParams.get("mensaje");

    if (!message) {
      return NextResponse.json(
        { error: "Message parameter is required" },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
    }

    // Calculate optimized timestamp using custom algorithm
    const optimizedTimestamp = calculateOptimizedTimestamp(message);

    // Create smart contract transaction
    const tx = {
      to: CONTRACT_ADDRESS,
      abi: abi,
      functionName: "storeMessage",
      args: [message, optimizedTimestamp],
    };

    // Serialize transaction
    const serialized = serialize(tx);

    // Create response
    const resp: ExecutionResponse = {
      serializedTransaction: serialized,
      chainId: avalancheFuji.name,
    };

    return NextResponse.json(resp, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Error in POST request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Custom algorithm to calculate optimized timestamp based on message content
function calculateOptimizedTimestamp(message: string): number {
  // Get the current timestamp as a starting point
  const currentTimestamp = Math.floor(Date.now() / 1000);

  // Custom algorithm: Add character codes to create a unique offset
  // This is your unique business logic - you can make this as complex as needed
  let offset = 0;

  for (let i = 0; i < message.length; i++) {
    // Sum character codes and use position as a multiplier
    offset += message.charCodeAt(i) * (i + 1);
  }

  // Ensure offset is reasonable (1 hour max)
  const maxOffset = 3600;
  offset = offset % maxOffset;

  // Calculate final optimized timestamp
  return currentTimestamp + offset;
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204, // Sin Contenido
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version",
    },
  });
}
