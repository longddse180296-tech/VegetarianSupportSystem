export function mockSendToAI(message: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        `Mình đã nhận được câu hỏi: "${message.trim()}". Đây là phản hồi mô phỏng trong lúc chờ kết nối Backend 3. Bạn có thể hỏi mình về công thức món chay hoặc cách lên thực đơn nhé!`,
      );
    }, 2000);
  });
}
