import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { getBackendUrl } from '@/lib/utils';
import { fetcher } from '@/lib/utils'; // Assuming generic fetcher exists, otherwise I'll define one

export interface Agent {
    id: string;
    name: string;
    description?: string;
    mode: 'simple' | 'advanced';
}

export function useAgents() {
    const { data: session } = useSession();
    const backendUrl = getBackendUrl();
    const userId = session?.user?.id;

    const { data, error, isLoading } = useSWR<Agent[]>(
        userId ? `${backendUrl}/api/agents?userId=${userId}` : null,
        async (url: string) => {
            const res = await fetch(url as string, {
                headers: {
                    Authorization: (session as any)?.accessToken ? `Bearer ${(session as any).accessToken}` : "",
                },
            });
            if (!res.ok) throw new Error('Failed to fetch agents');
            return res.json();
        }
    );

    return {
        agents: data || [],
        isLoading,
        isError: error,
    };
}
