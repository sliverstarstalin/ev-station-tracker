import React from 'react';
import { motion } from 'framer-motion';
const Card = ({ children, className = "" }) => <div className={"border rounded-lg shadow " + className}>{children}</div>;
const CardContent = ({ children, className = "" }) => <div className={"p-4 " + className}>{children}</div>;

export default function StationList({ stations, loading, error }) {
  if (loading) return <p>Loading stations…</p>;
  if (error)   return <p className="text-red-600">{error}</p>;
  if (!stations.length) return <p>No stations in this area.</p>;

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {stations.map((s) => (
        <motion.div key={s.ID} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
          <Card className="rounded-2xl shadow">
            <CardContent className="p-4 flex flex-col gap-1">
              <h3 className="text-lg font-semibold">{s.AddressInfo.Title}</h3>
              <p className="text-sm">
                {s.AddressInfo.Town}{s.AddressInfo.StateOrProvince ? `, ${s.AddressInfo.StateOrProvince}` : ''}
              </p>
              {s.Distance && <p className="text-sm">{s.Distance.toFixed(1)} km away</p>}
              <p className="text-sm">Network: {s.OperatorInfo?.Title || 'Unknown'}</p>
              <p className="text-sm">Ports: {s.Connections?.length ?? 'N/A'}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </section>
  );
}
