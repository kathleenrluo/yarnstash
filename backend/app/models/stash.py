"""
Stash Model

Represents yarn inventory - how much of each yarn you actually own.

Key Design Principle:
- StashEntry tracks quantity, Yarn tracks metadata
- Stash can only be updated through specific service methods (invariant enforcement)
- This separation allows yarn information to persist even when quantity is 0
"""

from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class StashEntry(Base):
    """
    StashEntry model - tracks how much yarn you own.
    
    This is separate from Yarn metadata to enforce the principle that:
    - Yarn information persists (even at 0g)
    - Inventory is tracked separately
    - Stash updates go through controlled methods only
    """
    
    __tablename__ = "stash_entries"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key to Yarn
    yarn_id = Column(Integer, ForeignKey("yarns.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    
    # Inventory quantity in grams
    # Can be 0 - this means you don't have any, but the yarn info is still kept
    total_grams_owned = Column(Float, nullable=False, default=0.0)
    
    # Timestamps
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    yarn = relationship("Yarn", back_populates="stash_entries")
    
    def __repr__(self):
        """String representation for debugging."""
        return f"<StashEntry(id={self.id}, yarn_id={self.yarn_id}, grams={self.total_grams_owned})>"
