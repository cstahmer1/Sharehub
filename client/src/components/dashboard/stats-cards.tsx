import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  CheckCircle, 
  Star, 
  DollarSign,
  Clock,
  Calendar,
  Target
} from "lucide-react";

interface StatsCardsProps {
  activeProjects: number;
  completedJobs: number;
  averageRating: number;
  totalEarnings?: number;
  responseTime?: string;
  completionRate?: number;
  className?: string;
}

interface StatCardData {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
    label: string;
  };
  color: 'primary' | 'secondary' | 'accent' | 'success' | 'warning';
}

export default function StatsCards({
  activeProjects,
  completedJobs,
  averageRating,
  totalEarnings,
  responseTime,
  completionRate,
  className = ""
}: StatsCardsProps) {
  
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'secondary':
        return 'bg-secondary/10 text-secondary';
      case 'accent':
        return 'bg-accent/10 text-accent';
      case 'success':
        return 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400';
      case 'warning':
        return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-red-500" />;
      default:
        return <Minus className="w-3 h-3 text-muted-foreground" />;
    }
  };

  // Calculate stats data
  const statsData: StatCardData[] = [
    {
      title: "Active Projects",
      value: activeProjects,
      description: "Currently in progress",
      icon: <Calendar className="w-8 h-8" />,
      color: 'secondary'
    },
    {
      title: "Completed Jobs",
      value: completedJobs,
      description: "Total completed projects",
      icon: <CheckCircle className="w-8 h-8" />,
      color: 'accent'
    },
    {
      title: "Average Rating",
      value: averageRating > 0 ? averageRating.toFixed(1) : "No reviews",
      description: "Overall satisfaction rating",
      icon: <Star className="w-8 h-8" />,
      color: 'warning'
    }
  ];

  // Add optional stats if provided
  if (totalEarnings !== undefined) {
    statsData.push({
      title: "Total Earnings",
      value: `$${totalEarnings.toLocaleString()}`,
      description: "Revenue this month",
      icon: <DollarSign className="w-8 h-8" />,
      color: 'success'
    });
  }

  if (responseTime) {
    statsData.push({
      title: "Response Time",
      value: responseTime,
      description: "Average reply time",
      icon: <Clock className="w-8 h-8" />,
      color: 'primary'
    });
  }

  if (completionRate !== undefined) {
    statsData.push({
      title: "Completion Rate",
      value: `${completionRate}%`,
      description: "Projects completed on time",
      icon: <Target className="w-8 h-8" />,
      color: 'accent'
    });
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 ${className}`}>
      {statsData.map((stat, index) => (
        <Card 
          key={stat.title} 
          className="hover:shadow-md transition-shadow duration-200"
          data-testid={`stat-card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  <div className="flex items-baseline space-x-2">
                    <p 
                      className="text-2xl font-bold text-primary"
                      data-testid={`stat-value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {stat.value}
                    </p>
                    {stat.trend && (
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(stat.trend.direction)}
                        <span className={`text-xs font-medium ${
                          stat.trend.direction === 'up' ? 'text-green-600' :
                          stat.trend.direction === 'down' ? 'text-red-600' :
                          'text-muted-foreground'
                        }`}>
                          {stat.trend.value}
                        </span>
                      </div>
                    )}
                  </div>
                  {stat.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  )}
                  {stat.trend && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.trend.label}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
