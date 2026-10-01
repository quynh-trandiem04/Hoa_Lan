import PlantingAndCare from './PlantingAndCare';

interface ApplicationsProps {
  isAdmin?: boolean;
}

export default function Applications({ isAdmin = false }: ApplicationsProps) {
  return (
    <PlantingAndCare
      section="application"
      breadcrumbLabel="Tin tức"
      eyebrow="Tin tức về hoa lan"
      title="Tin Tức"
      description="Khám phá các bài viết và thông tin mới về hoa lan."
      isAdmin={isAdmin}
    />
  );
}
