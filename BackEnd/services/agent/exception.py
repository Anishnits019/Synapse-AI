
class StorageError(Exception):
    """Base class for storage-related failures."""
    pass

class S3DownloadError(StorageError):
    """Raised specifically when an S3 object cannot be retrieved."""
    pass

class ParsingError(Exception):
    """Base class for document parsing failures."""
    pass

class PDFExtractionError(ParsingError):
    """Raised specifically when PyMuPDF fails to read text or images."""
    pass

class LLMGenerationError(Exception):
    """Raised when there is an error in generating LLM responses."""
    pass


class AgentError(Exception):
    """Base class for errors raised while an agent processes a request."""


class AgentInputError(AgentError):
    """Raised when an agent request or its required input is invalid."""


class AgentResponseError(AgentError):
    """Raised when an external service returns an invalid response."""


class AgentExecutionError(AgentError):
    """Raised when an agent fails while executing its workflow."""