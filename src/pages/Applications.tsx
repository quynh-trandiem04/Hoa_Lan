import PlantingAndCare from './PlantingAndCare';

interface ApplicationsProps {
  isAdmin?: boolean;
}

export default function Applications({ isAdmin = false }: ApplicationsProps) {
  return (
    <PlantingAndCare
      section="application"
      breadcrumbLabel="Ứng dụng"
      eyebrow="Giá trị và ứng dụng của hoa lan"
      title="Ứng Dụng"
      description="Khám phá các bài viết về ứng dụng của hoa lan trong đời sống, nghiên cứu và sản xuất."
      isAdmin={isAdmin}
    />
  );
}
