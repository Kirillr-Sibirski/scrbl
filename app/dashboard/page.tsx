export default function Dashboard() {
    return (
        <div className="container px-32 grid grid-cols-8 gap-4">
            <div className="h-12 px-6 py-4 grid-cols-subgrid col-span-full flex flex-row items-center rounded-lg bg-d-100/70 border-2 border-d-100"></div>
            <div className="h-96 px-6 py-4 grid-cols-subgrid col-span-3 flex flex-row rounded-lg bg-d-100/70 border-2 border-d-100">
                <h1 className="font-semibold text-lg">Loan Operations</h1>
            </div>
            <div className="h-96 px-6 py-4 grid-cols-subgrid col-span-5 flex flex-row rounded-lg bg-d-100/70 border-2 border-d-100">
                <h1>Escrow Wallet Operations</h1>
            </div>
        </div>
    )
}
