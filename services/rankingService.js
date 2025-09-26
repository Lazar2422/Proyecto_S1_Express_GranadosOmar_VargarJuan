import { ObjectId } from "mongodb";

export const recalculateRanking = async (itemId, db) => {
  const reviews = await db.collection("reviews").find({ movieId: new ObjectId(itemId) }).toArray();

  if (reviews.length === 0) {
    await db.collection("catalogo").updateOne(
      { _id: new ObjectId(itemId) },
      { $set: { "user_votes.average_rating": 0, "user_votes.vote_count": 0 } }
    );
    return;
  }

  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  const avg = total / reviews.length;

  await db.collection("catalogo").updateOne(
    { _id: new ObjectId(itemId) },
    { 
      $set: { 
        "user_votes.average_rating": parseFloat(avg.toFixed(2)), 
        "user_votes.vote_count": reviews.length 
      }
    }
  );
};
