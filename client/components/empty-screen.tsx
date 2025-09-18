import { ExternalLink } from '@/components/external-link'

const exampleMessages = [
  {
    heading: 'Explain technical concepts',
    message: `What is a "serverless function"?`
  },
  {
    heading: 'Summarize an article',
    message: 'Summarize the following article for a 2nd grader: \n'
  },
  {
    heading: 'Draft an email',
    message: `Draft an email to my boss about the following: \n`
  }
]

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
        <h1 className="text-lg font-semibold">
          Welcome to Fluent AI Chatbot!
        </h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Start a conversation by typing a message below.
      </p>
      <p className="text-sm text-muted-foreground">
        Try these examples:
      </p>
      <ul className="list-disc pl-6">
        {exampleMessages.map((example, index) => (
          <li key={index}>
            <strong>{example.heading}</strong>: {example.message}
          </li>
        ))}
      </ul>
      <ExternalLink href="https://github.com/sravanr788/fluent-ai">
        View on GitHub
      </ExternalLink>
    </div>
  )
}
