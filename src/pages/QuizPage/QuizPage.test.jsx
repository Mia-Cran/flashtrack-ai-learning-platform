import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'
import QuizPage from './QuizPage'

const quiz = {
  _id: 'quiz1',
  topic: { _id: 'topic1', term: 'Recursion' },
  questions: {
    Beginner: [
      { _id: 'q1', text: 'What calls itself?', type: 'multipleChoice', options: ['A function', 'A loop', 'A class', 'A file'] },
      { _id: 'q2', text: 'Base case needed?', type: 'multipleChoice', options: ['Yes', 'No', 'Sometimes', 'Never'] },
    ],
    Intermediate: [],
    Advanced: [],
  },
}

function renderQuiz() {
  return render(
    <MemoryRouter initialEntries={['/quiz/topic1']}>
      <Routes>
        <Route path="/quiz/:topicId" element={<QuizPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function jsonResponse(body, status = 200) {
  return Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) })
}

describe('QuizPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('shows the quiz questions once loaded', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => jsonResponse(quiz))

    renderQuiz()

    expect(await screen.findByText('Recursion Quiz')).toBeInTheDocument()
    expect(screen.getByText('What calls itself?')).toBeInTheDocument()
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument()
  })

  it('shows an error when the quiz does not exist', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      jsonResponse({ message: 'Quiz not found' }, 404),
    )

    renderQuiz()

    expect(await screen.findByText(/Quiz not found/)).toBeInTheDocument()
  })

  it('submits answers and shows the score', async () => {
    localStorage.setItem('jwt', 'token')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (String(url).endsWith('/submit')) {
        return jsonResponse({ score: 1, maxScore: 2 }, 201)
      }
      if (String(url).includes('/responses')) {
        return jsonResponse({ attempts: [] })
      }
      return jsonResponse(quiz)
    })

    renderQuiz()
    const user = userEvent.setup()

    await screen.findByText('What calls itself?')
    await user.click(screen.getByLabelText(/A\. A function/))
    await user.click(screen.getByRole('button', { name: /Next/ }))
    await user.click(screen.getByLabelText(/B\. No/))
    await user.click(screen.getByRole('button', { name: /Submit/ }))

    await waitFor(() => expect(screen.getByText('Quiz Complete!')).toBeInTheDocument())
    expect(screen.getByText('1/2')).toBeInTheDocument()

    const submitCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/submit'))
    const body = JSON.parse(submitCall[1].body)
    expect(body).toEqual({
      difficulty: 'Beginner',
      responses: [{ userAnswer: 'A' }, { userAnswer: 'B' }],
    })
    expect(submitCall[1].headers.Authorization).toBe('Bearer token')
  })

  it('tells a signed-out user to log in before submitting', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => jsonResponse(quiz))

    renderQuiz()
    const user = userEvent.setup()

    await screen.findByText('What calls itself?')
    await user.click(screen.getByLabelText(/A\. A function/))
    await user.click(screen.getByRole('button', { name: /Next/ }))
    await user.click(screen.getByLabelText(/A\. Yes/))
    await user.click(screen.getByRole('button', { name: /Submit/ }))

    expect(await screen.findByText(/must be logged in/)).toBeInTheDocument()
  })
})
