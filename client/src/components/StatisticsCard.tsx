import { Link } from "wouter";

interface StatisticsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  detailsUrl: string;
}

export default function StatisticsCard({ title, value, icon, color, detailsUrl }: StatisticsCardProps) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-3 rounded-md bg-${color}-100`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-semibold text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <Link href={detailsUrl}>
            <a className="font-medium text-primary hover:text-secondary">View details</a>
          </Link>
        </div>
      </div>
    </div>
  );
}
