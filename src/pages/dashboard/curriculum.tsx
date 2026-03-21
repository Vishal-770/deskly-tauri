import { useEffect, useState } from "react";
import {
  getCurriculumCategories,
  getCurriculumCategoryCourses,
  downloadCurriculumSyllabus,
  type CurriculumCategory,
  type CurriculumCourse,
} from "@/lib/features";
import { Download, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CurriculumPage() {
  const [categories, setCategories] = useState<CurriculumCategory[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [courses, setCourses] = useState<CurriculumCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const res = await getCurriculumCategories();
      if (!res.success || !res.data) {
        setError(res.error ?? "Failed to fetch curriculum categories");
        setLoading(false);
        return;
      }

      setCategories(res.data);
      const first = res.data[0]?.code ?? "";
      setSelected(first);

      if (first) {
        const courseRes = await getCurriculumCategoryCourses(first);
        if (courseRes.success && courseRes.data) {
          setCourses(courseRes.data);
        } else {
          setError(courseRes.error ?? "Failed to fetch curriculum courses");
        }
      }

      setLoading(false);
    };

    void run();
  }, []);

  const onCategoryChange = async (code: string) => {
    setSelected(code);
    const res = await getCurriculumCategoryCourses(code);
    if (res.success && res.data) {
      setCourses(res.data);
      setError(null);
    } else {
      setError(res.error ?? "Failed to fetch curriculum courses");
    }
  };

  const handleDownload = async (courseCode: string) => {
    setDownloading(courseCode);
    try {
      const res = await downloadCurriculumSyllabus(courseCode);
      if (res.success && res.data) {
        const { filename, data: b64, contentType } = res.data;
        
        // Convert base64 to Blob
        const byteCharacters = atob(b64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: contentType });
        
        // Trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setDownloaded(courseCode);
        setTimeout(() => setDownloaded(null), 3000);
      } else {
        alert(res.error || "Failed to download syllabus");
      }
    } catch (err) {
      alert("Something went wrong during download");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="w-full px-6 lg:px-10 py-10 space-y-8 pb-20">
      <header>
        <h1 className="text-4xl font-bold tracking-tight">Curriculum</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Category-wise curriculum and course details
        </p>
      </header>

      {loading ? (
        <main className="p-6 h-full flex items-center justify-center">
          Loading curriculum...
        </main>
      ) : (
        <>
          {error && (
            <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-5 text-destructive font-medium">
              {error}
            </div>
          )}

          <section className="rounded-xl border p-4 bg-card/30">
            <label className="text-sm text-muted-foreground mr-4">Category</label>
            <Select value={selected} onValueChange={onCategoryChange}>
              <SelectTrigger className="mt-2 w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.code} value={cat.code}>
                    {cat.code} • {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          <section className="rounded-xl border p-4 bg-card/30 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Code</th>
                  <th className="py-2">Title</th>
                  <th className="py-2">Type</th>
                  <th className="py-2 text-center">Credits</th>
                  <th className="py-2 text-right pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr
                    key={`${course.serialNo}-${course.code}`}
                    className="border-b"
                  >
                    <td className="py-2">{course.code}</td>
                    <td className="py-2">{course.title}</td>
                    <td className="py-2">{course.courseType}</td>
                    <td className="py-2 text-center">{course.credits}</td>
                    <td className="py-2 text-right pr-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={() => handleDownload(course.code)}
                        disabled={downloading === course.code}
                        title="Download Syllabus"
                      >
                        {downloading === course.code ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : downloaded === course.code ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
