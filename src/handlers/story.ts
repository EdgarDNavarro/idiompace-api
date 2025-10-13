import { Request, Response } from 'express';
import Story from '../models/Story.model';
import { paginate } from '../utils/paginate';
import { Op } from 'sequelize';

export const getStories = async (req: Request, res: Response) => {
  const pagination = (req as any).pagination;
  const { idiom, title, category } = req.query;
  try {
    const where: any = {};
    if (idiom) {
      where.idiom = idiom;
    }
    if (title) {
      where.title = {
        [Op.iLike]: `%${title}%`
      };
    }
    if (category) {
      where.categories = {
        [Op.contains]: [category]  // busca que el array JSONB contenga el valor
      };
    }

    const result = await paginate(
      Story,
      {
        order: [['id', 'ASC']],
        include: ['tests', 'vocabularies', 'exercises'],
        distinct: true,
        where,
      },
      pagination
    );

    res.json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getStoryById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const story = await Story.findByPk(id, {
    include: ['tests', 'vocabularies', 'exercises']
  });
  if (!story) {
    res.status(404).json({ error: 'Story not found' });
    return;
  }
  res.json({ data: story });
};

export const createStory = async (req: Request, res: Response) => {
  try {
    const story = await Story.create(req.body);
    res.status(201).json({ data: story });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Invalid story data' });
  }
};

export const updateStory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const story = await Story.findByPk(id);

  if (!story) {
    res.status(404).json({ error: 'Story not found' });
    return;
  }

  try {
    await story.update(req.body);
    await story.save();
    res.send("Story updated successfully");
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Invalid update data' });
  }
};

export const toggleIsInteractive = async (req: Request, res: Response) => {
  const { id } = req.params;
  const story = await Story.findByPk(id);

  if (!story) {
    res.status(404).json({ error: 'Story not found' });
    return;
  }

  story.is_interactive = !story.dataValues.is_interactive;
  await story.save();

  res.json({ data: story });
};

export const deleteStory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const story = await Story.findByPk(id);

  if (!story) {
    res.status(404).json({ error: 'Story not found' });
    return;
  }

  await story.destroy();
  res.json({ data: 'Story deleted successfully' });
};
