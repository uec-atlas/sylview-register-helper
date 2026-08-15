export type RequestInfoMessage = {
  type: "requestInfo";
  data?: never;
};

export type ResponseInfoMessage = {
  type: "responseInfo";
  data: {
    grade: number;
    term: string;
    department: string;
    period: string;
    year: number;
  };
};

export type RequestInputCodeMessage = {
  type: "requestInputCode";
  data: {
    timeTableCode: string;
  };
};

export type RequestOpenSyllabusMessage = {
  type: "requestOpenSyllabus";
  data: {
    timeTableCode: string;
  };
};

export type MessagePayload =
  | RequestInfoMessage
  | ResponseInfoMessage
  | RequestInputCodeMessage
  | RequestOpenSyllabusMessage;
