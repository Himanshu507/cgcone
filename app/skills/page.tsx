import { getSkills } from "@/lib/registry"
import SkillsClient from "./skills-client"

export const metadata = {
  title: "Skills - CGCone",
  description: "Browse curated skills for Claude Code.",
}

export default function SkillsPage() {
  const skills = getSkills()
  return <SkillsClient skills={skills} />
}
