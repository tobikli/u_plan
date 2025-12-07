export default async function CoursesView({programId}: {programId: string}) {
  return (<h1 className="text-xl">Courses for program {programId}</h1>);
}