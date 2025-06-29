import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// Lucide icons for visual cues in feedback
import { AlertTriangle, CheckCircle, Info, Lightbulb, Code } from 'lucide-react';

const feedbackTypeStyles = {
  error: {
    icon: <AlertTriangle className="inline-block h-5 w-5 mr-2 text-red-500" />,
    className: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900 border-red-500',
  },
  suggestion: {
    icon: <Lightbulb className="inline-block h-5 w-5 mr-2 text-yellow-500" />,
    className: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900 border-yellow-500',
  },
  best_practice: {
    icon: <CheckCircle className="inline-block h-5 w-5 mr-2 text-green-500" />,
    className: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900 border-green-500',
  },
  nitpick: {
    icon: <Info className="inline-block h-5 w-5 mr-2 text-blue-500" />, // Using Info for Nitpick
    className: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900 border-blue-500',
  },
  info: {
    icon: <Info className="inline-block h-5 w-5 mr-2 text-gray-500" />,
    className: 'text-gray-700 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-700 border-gray-500',
  },
  default: {
    icon: <Code className="inline-block h-5 w-5 mr-2 text-gray-500" />,
    className: 'text-gray-800 dark:text-gray-200',
    bgColor: 'bg-gray-100 dark:bg-gray-800 border-gray-400',
  }
};

const getFeedbackType = (text) => {
  if (!text) return 'default';
  const lowerText = text.toLowerCase();
  if (lowerText.includes('**[error]**')) return 'error';
  if (lowerText.includes('**[suggestion]**')) return 'suggestion';
  if (lowerText.includes('**[best practice]**')) return 'best_practice';
  if (lowerText.includes('**[nitpick]**')) return 'nitpick';
  if (lowerText.includes('**[info]**')) return 'info';
  return 'default';
};


// Custom renderer for list items to apply styling based on content
const CustomListItem = ({ node, ...props }) => {
    // Combine text from all children, as formatting (like strong for [Error]) might split it
    const listItemText = node.children.map(child =>
        child.children?.map(grandChild => grandChild.value).join('') || child.value || ''
    ).join('');

    const type = getFeedbackType(listItemText);
    const style = feedbackTypeStyles[type];

    return (
      <li
        className={`p-3 my-2 border-l-4 rounded-r-md ${style.bgColor} ${style.className} list-none`}
        {...props}
      >
        {style.icon}
        {props.children}
      </li>
    );
};

const ReviewFeedbackDisplay = ({ markdownContent }) => {
  if (!markdownContent) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-4">
        <Info className="w-12 h-12 mb-4" />
        <p className="text-lg">No review feedback to display.</p>
        <p>Generate or paste code and click "Review Code".</p>
      </div>
    );
  }

  return (
    <div className="prose dark:prose-invert max-w-none p-4 h-full overflow-y-auto">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          li: CustomListItem,
          // You can add more custom renderers here for other elements like headings, code blocks, etc.
          // For example, to style code blocks:
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="my-2 bg-gray-100 dark:bg-gray-900 rounded p-0">
                <div className="bg-gray-200 dark:bg-gray-700 px-4 py-1 rounded-t text-sm font-mono text-gray-600 dark:text-gray-300">
                  {match[1]}
                </div>
                <pre className="p-4 overflow-x-auto"><code className={className} {...props}>{children}</code></pre>
              </div>
            ) : (
              <code className={`bg-gray-200 dark:bg-gray-700 px-1 rounded text-sm ${className}`} {...props}>
                {children}
              </code>
            );
          },
          // Style headings
          h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-3 border-b pb-2 border-gray-300 dark:border-gray-600" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-xl font-semibold mt-5 mb-2 border-b pb-1 border-gray-300 dark:border-gray-600" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-4 mb-1" {...props} />,
        }}
      >
        {markdownContent}
      </ReactMarkdown>
    </div>
  );
};

export default ReviewFeedbackDisplay;
