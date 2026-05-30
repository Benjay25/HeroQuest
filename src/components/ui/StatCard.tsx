import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import type { TypographyProps } from '@mui/material/Typography';

/**
 * StatCard — a labelled metric card for the dashboard.
 *
 * Displays a single stat: a colour-coded label, a prominent value,
 * and an optional description line beneath.
 *
 * Using a shared component here rather than repeating card markup
 * means the dashboard stat section is defined in one place. If the
 * visual style changes, it changes for all stats simultaneously.
 *
 * Props:
 *   label       — the overline eyebrow (e.g. "Daily Quests")
 *   value       — the prominent display value (e.g. "3 / 5")
 *   description — optional supporting text beneath the value
 *   color       — MUI colour token for the label (default: "text.secondary")
 */

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  description?: string;
  color?: TypographyProps['color'];
}

export default function StatCard({
  label,
  value,
  description,
  color = 'text.secondary',
}: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="overline" color={color}>
          {label}
        </Typography>
        <Typography variant="h4" sx={{ my: 0.5 }}>
          {value}
        </Typography>
        {description && (
          <Typography variant="body2">
            {description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
