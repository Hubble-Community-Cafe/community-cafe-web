import { Card, PageHeader } from '../components/PageHeader'
import { DailyDishSection } from './menu/DailyDishSection'
import { usePermissions } from '../lib/usePermissions'

/** The Daily Dinner Dish (Hubble only). Its own module so it can be delegated to
 *  DDD posters; viewers see it read-only. */
export function DailyDishPage() {
  const { canEditDailyDish } = usePermissions()

  return (
    <div>
      <PageHeader
        title="Daily dish"
        description="Manage Hubble's Daily Dinner Dish. Upcoming dishes appear on the public site."
      />
      <Card>
        <DailyDishSection canEdit={canEditDailyDish} />
      </Card>
    </div>
  )
}
