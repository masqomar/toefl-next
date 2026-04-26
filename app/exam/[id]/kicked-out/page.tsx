import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default function KickedOutPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center text-4xl mb-4">
            🚫
          </div>
          <CardTitle className="text-2xl text-red-600">Exam Terminated</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-6">
            Your exam has been terminated due to excessive violations of the exam rules.
            This action cannot be undone.
          </p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-red-800 font-medium mb-2">Violations detected:</p>
            <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
              <li>Tab switching detected</li>
              <li>Copy/paste attempt</li>
              <li>Right-click attempt</li>
              <li>Keyboard shortcuts blocked</li>
            </ul>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            If you believe this was a mistake, please contact your administrator.
          </p>

          <Link href="/dashboard">
            <Button className="w-full">
              Return to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
