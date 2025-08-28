import React from 'react';

interface Fracionamento {
    id: number;
    nome: string;
    quantidade: number;
    data: string;
}

const fracionamentos: Fracionamento[] = [
    { id: 1, nome: 'Produto A', quantidade: 10, data: '2024-06-01' },
    { id: 2, nome: 'Produto B', quantidade: 5, data: '2024-06-02' },
    { id: 3, nome: 'Produto C', quantidade: 8, data: '2024-06-03' },
];

export const Fracionamentos: React.FC = () => {
    return (
        <div style={{ padding: '2rem' }}>
            <h2>Fracionamentos</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={{ border: '1px solid #ccc', padding: '8px' }}>ID</th>
                        <th style={{ border: '1px solid #ccc', padding: '8px' }}>Nome</th>
                        <th style={{ border: '1px solid #ccc', padding: '8px' }}>Quantidade</th>
                        <th style={{ border: '1px solid #ccc', padding: '8px' }}>Data</th>
                    </tr>
                </thead>
                <tbody>
                    {fracionamentos.map((item) => (
                        <tr key={item.id}>
                            <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.id}</td>
                            <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.nome}</td>
                            <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.quantidade}</td>
                            <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.data}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
